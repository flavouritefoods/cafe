import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { ArrowRight, Leaf, Star, Gift, Truck } from 'lucide-react'
import { ProductCard } from '@/components/ProductCard'
import { HeroBannerCarousel } from '@/components/HeroBannerCarousel'

export const dynamic = 'force-dynamic'

// Helper for category themes
const getCategoryGradient = (theme: string) => {
  if (theme?.startsWith('#')) return theme // Solid hex color
  switch (theme) {
    case 'chocolate': return '#5D4037'
    case 'pink': return '#E91E63'
    case 'cream': return '#FFF9C4'
    case 'mint': return '#81C784'
    case 'purple': return '#8E24AA'
    case 'gold': return '#FBC02D'
    default: return '#5D4037'
  }
}

async function getHomepageData() {
  try {
    const payload = await getPayload({ config })
    
    const [banners, categories, bestSellersResult, storeSettings] = await Promise.all([
      payload.find({ collection: 'banners', where: { isActive: { equals: true } }, limit: 20, sort: 'createdAt' }),
      payload.find({ collection: 'categories', limit: 10, sort: 'title' }),
      payload.find({ collection: 'products', where: { isBestSeller: { equals: true } }, limit: 4 }),
      payload.findGlobal({ slug: 'store-settings' }).catch(() => null),
    ])

    // Prioritize banners configured directly in Store Settings if present
    const settingsBanners = (storeSettings as any)?.heroBanners
    let activeBanners: any[] = []
    if (Array.isArray(settingsBanners) && settingsBanners.length > 0) {
      activeBanners = settingsBanners.filter((b: any) => b.isActive !== false)
    }
    if (activeBanners.length === 0) {
      activeBanners = banners.docs
    }
    
    // If no best sellers are flagged yet, show latest 4 products
    let bestSellers = bestSellersResult.docs
    if (bestSellers.length === 0) {
      const anyProducts = await payload.find({ collection: 'products', limit: 4, sort: '-createdAt' })
      bestSellers = anyProducts.docs
    }
    
    return {
      banners: activeBanners,
      categories: categories.docs,
      bestSellers,
    }
  } catch (e) {
    return { banners: [], categories: [], bestSellers: [] }
  }
}

export default async function Home() {
  const data = await getHomepageData()
  
  const displayCategories = data.categories
  const displayProducts = data.bestSellers

  return (
    <div className="bg-brand-cream min-h-screen">
      
      {/* Hero Banner Carousel Section */}
      <HeroBannerCarousel banners={data.banners} />

      {/* Categories */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Leaf className="mx-auto text-brand-dark mb-2" size={32} />
          <h2 className="text-3xl md:text-4xl font-serif text-brand-dark mb-12 flex items-center justify-center gap-4">
            <div className="h-0.5 w-12 bg-brand-dark"></div>
            Shop by Category
            <div className="h-0.5 w-12 bg-brand-dark"></div>
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8">
            {displayCategories.map((cat: any) => (
              <Link href={`/shop?category=${cat.slug}`} key={cat.id} className="group flex flex-col items-center">
                <div 
                  className="w-28 h-28 rounded-full flex items-center justify-center text-4xl mb-4 border-4 border-brand-cream transition-all duration-300 group-hover:border-brand-dark group-hover:shadow-lg group-hover:-translate-y-2"
                  style={{ background: getCategoryGradient(cat.colorTheme) }}
                >
                  {cat.emoji || '📦'}
                </div>
                <span className="font-medium text-gray-800">{cat.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-20 max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-10">
          <div>
            <Leaf className="text-brand-dark mb-2" size={32} />
            <h2 className="text-3xl md:text-4xl font-serif text-brand-dark flex items-center gap-4">
              <div className="h-0.5 w-12 bg-brand-dark"></div>
              <em>Best Sellers</em>
              <div className="h-0.5 w-12 bg-brand-dark"></div>
            </h2>
          </div>
          <Link href="/shop" className="hidden sm:flex text-brand-dark font-semibold hover:text-brand-medium items-center gap-2">
            View All Products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {displayProducts.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <div className="mt-8 text-center sm:hidden">
          <Link href="/shop" className="inline-flex text-brand-dark font-semibold hover:text-brand-medium items-center gap-2 border-b-2 border-brand-dark pb-1">
            View All Products <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex items-center justify-center gap-4">
            <Leaf className="text-green-600" size={40} />
            <div>
              <h4 className="font-bold text-gray-900">100% Vegetarian</h4>
              <p className="text-sm text-gray-500">No Eggs | No Meat</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Star className="text-yellow-500" size={40} />
            <div>
              <h4 className="font-bold text-gray-900">Premium Ingredients</h4>
              <p className="text-sm text-gray-500">Quality you can trust</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Gift className="text-brand-purple" size={40} />
            <div>
              <h4 className="font-bold text-gray-900">Beautifully Packed</h4>
              <p className="text-sm text-gray-500">Perfect for Gifting</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <Truck className="text-blue-500" size={40} />
            <div>
              <h4 className="font-bold text-gray-900">Safe Delivery</h4>
              <p className="text-sm text-gray-500">Pan India</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
